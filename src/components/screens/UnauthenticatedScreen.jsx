import { Button } from "../ui/Button";

export const UnauthenticatedScreen = ({ onConnect }) => {
  return (
    <div className="flex flex-col space-y-3 p-4 text-sm">
      <p>Connect to Nota to view and add notes to your emails.</p>
      <Button onClick={onConnect}>Connect to Nota</Button>
    </div>
  );
};
