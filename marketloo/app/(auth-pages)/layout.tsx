export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] space-y-6 rounded-xl bg-[#2C3038] p-8">
        {children}
      </div>
    </div>
  );
}
