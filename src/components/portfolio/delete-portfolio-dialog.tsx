import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";

export const DeletePortfolioDialog = (props: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: () => Promise<void>;
}) => {
  const { isOpen, onOpenChange, onDelete } = props;
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete portfolio</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this portfolio? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={async () => {
              setIsLoading(true);
              await onDelete();
              setIsLoading(false);
            }}
            loading={isLoading}
          >
            Delete
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
