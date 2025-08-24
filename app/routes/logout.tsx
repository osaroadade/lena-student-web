import type { ActionFunction } from "react-router";
import { AuthController } from "~/features/auth";

export const action: ActionFunction = async () => {
    return AuthController.handleLogout();
};
