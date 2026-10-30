import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";

export function LogoutButton() {
  return <form action={logoutAction}><button className="secondary-button" type="submit"><LogOut size={16} />Log out</button></form>;
}
