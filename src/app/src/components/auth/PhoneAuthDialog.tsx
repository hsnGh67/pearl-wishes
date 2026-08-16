import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { PhoneAuthForm } from "./PhoneAuthForm";
import { User } from "../../schema/user.schema";

interface PhoneAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSuccess?: (profile: User) => void;
}

export function PhoneAuthDialog({
  open,
  onOpenChange,
  title = "Sign in",
  description = "Enter your phone number to continue",
  onSuccess,
}: PhoneAuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <PhoneAuthForm
          variant="dialog"
          title={title}
          description={description}
          onSuccess={(profile) => {
            onSuccess?.(profile);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
