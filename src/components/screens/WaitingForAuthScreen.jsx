import { Button } from "../ui/Button";

export const WaitingForAuthScreen = ({ onReopenLoginTab, onCancel }) => {
  return (
    <div className="flex flex-col space-y-3 p-4 text-sm">
      <div>
        <p className="font-medium">Waiting for authorization…</p>
        <p className="text-stone-600">
          Complete sign-in in the opened tab, then return here.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={onReopenLoginTab}>Re-open login tab</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
