import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useCallback,
  useState,
} from "react";
import {
  fetchThread,
  createNote,
  exchangePairingToken,
} from "../services/api.js";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  pollForPairingExchangeToken,
  getMailboxEmailAddressFromInboxSdk,
} from "../utils/auth.js";
import {
  emailThreadsWebUrl,
  emailThreadWebUrl,
  extensionPairingUrl,
} from "../utils/url_helpers.js";

import { Button } from "./ui/Button.jsx";
import { NoteRow } from "./notes/NoteRow.jsx";
import { LoadingScreen } from "./screens/LoadingScreen.jsx";
import { UnauthenticatedScreen } from "./screens/UnauthenticatedScreen.jsx";
import { WaitingForAuthScreen } from "./screens/WaitingForAuthScreen.jsx";
import { ErrorScreen } from "./screens/ErrorScreen.jsx";
import { getUserEmail, getUserImageUrl } from "../utils/helpers.js";

/**
 * --------------------------
 * State + reducer
 * --------------------------
 */

const initialState = {
  status: "loading", // "loading" | "unauthenticated" | "waiting" | "ready" | "error"
  threadSubject: null,
  threadId: null,
  notes: [],
  pairingToken: null,
  errorMessage: null,
};

function notesAppReducer(state, action) {
  switch (action.type) {
    case "REFRESH_STARTED":
      return {
        ...state,
        status: "loading",
        errorMessage: null,
      };

    case "UNAUTHENTICATED":
      return {
        ...initialState,
        status: "unauthenticated",
      };

    case "REFRESH_SUCCEEDED":
      return {
        ...state,
        status: "ready",
        threadSubject: action.threadSubject,
        threadId: action.threadId,
        notes: action.notes,
        errorMessage: null,
        pairingToken: null,
      };

    case "REFRESH_FAILED":
      return {
        ...state,
        status: "error",
        errorMessage: action.errorMessage || "Unknown error",
      };

    case "AUTH_STARTED":
      return {
        ...state,
        status: "waiting",
        pairingToken: action.pairingToken,
        errorMessage: null,
      };

    case "AUTH_CANCELED":
      return {
        ...initialState,
        status: "unauthenticated",
      };

    case "AUTH_FAILED":
      return {
        ...state,
        status: "error",
        errorMessage: action.errorMessage || "Failed to authenticate",
      };

    default:
      return state;
  }
}

/**
 * --------------------------
 * Main component
 * --------------------------
 */

const NotesApp = ({ sdk, threadView }) => {
  const [state, dispatch] = useReducer(notesAppReducer, initialState);
  const [newNote, setNewNote] = useState("");

  // Prevent state updates after unmount
  const isMountedRef = useRef(true);
  const [rawUserEmail, setRawUserEmail] = useState(null);
  const [rawUserImageUrl, setRawUserImageUrl] = useState(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      const [email, imageUrl] = await Promise.all([
        getUserEmail(),
        getUserImageUrl(),
      ]);
      if (!isMountedRef.current) return;

      setRawUserEmail(email);
      setRawUserImageUrl(imageUrl);
    })();
  }, []);

  // Allow canceling the auth polling loop
  const authCancelRef = useRef({ canceled: false });

  const mailboxEmailAddress = useMemo(() => {
    return getMailboxEmailAddressFromInboxSdk(sdk);
  }, [sdk]);

  const refresh = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      dispatch({ type: "UNAUTHENTICATED" });
      return;
    }

    dispatch({ type: "REFRESH_STARTED" });

    try {
      const gmailThreadId = await threadView.getThreadIDAsync();
      const subject = threadView.getSubject?.() ?? "(no subject)";

      const data = await fetchThread(
        gmailThreadId,
        subject,
        mailboxEmailAddress
      );

      console.log(">>> fetchThread data");
      console.log(">>>", data, data.thread.thread_subject);

      dispatch({
        type: "REFRESH_SUCCEEDED",
        threadSubject: data.thread.thread_subject,
        threadId: data.thread.id,
        notes: data.notes,
      });
    } catch (err) {
      if (err?.message === "unauthenticated") {
        await clearAuthToken();
        dispatch({ type: "UNAUTHENTICATED" });
      } else {
        dispatch({
          type: "REFRESH_FAILED",
          errorMessage: err?.message || "Unknown error",
        });
      }
    }
  }, [mailboxEmailAddress, threadView]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddNote = async (event) => {
    event.preventDefault();
    const trimmed = newNote.trim();
    if (!trimmed) return;

    try {
      const gmailThreadId = await threadView.getThreadIDAsync();
      const subject = threadView.getSubject?.() ?? "(no subject)";

      await createNote(gmailThreadId, subject, mailboxEmailAddress, trimmed);

      setNewNote("");
      await refresh();
    } catch (err) {
      alert(`Could not add note: ${err?.message || "Unknown error"}`);
    }
  };

  const handleLogout = async () => {
    await clearAuthToken();
    dispatch({ type: "UNAUTHENTICATED" });
  };

  const handleCancelAuth = () => {
    authCancelRef.current.canceled = true;
    dispatch({ type: "AUTH_CANCELED" });
  };

  const handleAuth = async () => {
    if (state.status === "waiting") return;

    const pairingToken = crypto.randomUUID();
    authCancelRef.current = { canceled: false };

    dispatch({ type: "AUTH_STARTED", pairingToken });

    const authUrl = extensionPairingUrl(pairingToken);
    const openedWindow = window.open(authUrl, "_blank");

    if (!openedWindow) {
      dispatch({
        type: "AUTH_FAILED",
        errorMessage:
          "Popup blocked. Please allow popups for Gmail and try again.",
      });
      return;
    }

    try {
      await pollForPairingExchangeToken({
        pairingToken,
        exchangePairingToken,
        shouldCancel: () =>
          !isMountedRef.current || authCancelRef.current.canceled,
      });

      const token = await getAuthToken();
      await setAuthToken(token);

      // Only refresh if still mounted and not canceled.
      if (!isMountedRef.current || authCancelRef.current.canceled) return;

      await refresh();
    } catch (err) {
      if (err?.code === "canceled") {
        dispatch({ type: "AUTH_CANCELED" });
        return;
      }

      if (err?.code === "timeout") {
        dispatch({
          type: "AUTH_FAILED",
          errorMessage: "Authorization timed out.",
        });
        return;
      }

      dispatch({
        type: "AUTH_FAILED",
        errorMessage: err?.message || "Failed to authenticate",
      });
    }
  };

  if (state.status === "loading") return <LoadingScreen />;
  if (state.status === "unauthenticated") {
    return <UnauthenticatedScreen onConnect={handleAuth} />;
  }

  if (state.status === "waiting") {
    return (
      <WaitingForAuthScreen
        pairingToken={state.pairingToken}
        onCancel={handleCancelAuth}
        onReopenLoginTab={() =>
          window.open(extensionPairingUrl(state.pairingToken), "_blank")
        }
      />
    );
  }

  if (state.status === "error") {
    return <ErrorScreen errorMessage={state.errorMessage} onRetry={refresh} />;
  }

  return (
    <>
      <div className="flex justify-between items-start p-4 border-stone-200 border-b w-full">
        <a className="font-medium text-sm" href={emailThreadsWebUrl()}>
          Nota Inbox
        </a>
        <img
          className="rounded-full size-5"
          src={rawUserImageUrl}
          title={rawUserEmail}
        />
      </div>
      <div className="flex flex-col space-y-4 p-4 text-stone-950 text-sm">
        <div className="flex justify-between items-start gap-x-1">
          <div>
            <p className="font-bold">{state.threadSubject || "(no subject)"}</p>
            <p className="text-stone-500 text-xs">{state.notes.length} notes</p>
          </div>
          <div class="flex justify-center items-center hover:bg-stone-200 p-1 rounded-full size-6 shrink-0">
            <a
              target="_blank"
              className=""
              title="View in Nota"
              href={emailThreadWebUrl(state.threadId)}
            >
              ↗
            </a>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          {state.notes.length === 0 ? (
            <p className="text-stone-500 italic">
              No notes yet. Add one below.
            </p>
          ) : (
            state.notes.map((note) => <NoteRow key={note.id} note={note} />)
          )}
        </div>

        <form
          onSubmit={handleAddNote}
          className="flex flex-col items-start gap-x-2 mt-8"
        >
          <textarea
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Type your note…"
            rows={3}
            className="p-2 border rounded w-full"
          />
          <Button type="submit" className="self-end mt-2">
            Add
          </Button>
        </form>
      </div>

      <details className="mt-4 p-4 border-stone-200 border-t">
        <summary className="text-stone-500 text-sm cursor-pointer select-none">
          Account Settings
        </summary>
        <div className="flex gap-x-2 mt-4">
          <img className="rounded-full size-5" src={rawUserImageUrl} />
          <p className="font-medium text-sm">{rawUserEmail}</p>
        </div>
        <Button onClick={handleLogout} className="mt-4">
          Logout
        </Button>
      </details>
    </>
  );
};

export default NotesApp;
