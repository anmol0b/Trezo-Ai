import { SidebarDemo } from "../../components/sidebar/sideBarDemo";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/options";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    return (
        <SidebarDemo>
                {children}
        </SidebarDemo>
    );
}
