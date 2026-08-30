declare global {
  namespace App {
    interface Locals {
      session: import('$lib/server/auth').Session | null;
    }

    interface PageData {
      session: import('$lib/server/auth').PublicSession | null;
    }
  }
}

export {};
