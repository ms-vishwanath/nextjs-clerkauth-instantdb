import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SignedOut>
        <div className="flex flex-col justify-center items-center h-dvh">
          <SignInButton mode="modal" />
        </div>
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </ClerkProvider>
  );
}
