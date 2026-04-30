export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages handle their own centering
  // This layout exists so we can later add things like
  // a logo at the top or a footer across all auth pages
  return <>{children}</>;
}
