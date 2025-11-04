import type { Metadata } from "next";
import { Bai_Jamjuree, Geist_Mono } from "next/font/google";
import "./globals.css";

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // add the weights you need
});

export const metadata = {
  title: "Relationship of Entities",
  description: "Visualize Wikipedia relationships",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${baiJamjuree.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}



// import "./globals.css";
// export default function Page() {
//   return <div className="card">Hello world</div>;
// }

