import { Button } from "../ui/Button";

export const ErrorScreen = ({ errorMessage, onRetry }) => {
  return (
    <div className="p-4">
      <div className="bg-red-100 p-3 rounded text-red-800 text-sm">
        {errorMessage}
      </div>
      <div className="mt-3">
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
};
