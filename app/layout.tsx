import "./globals.css"
// import Navbar from "@/components/navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-black text-white">
        {/* <Navbar /> */}
        <main className="pt-20">{children}</main>
      </body>
    </html>
  )
}