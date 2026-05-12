import Footer from "../../components/landing/footer";
import { NavbarDemo } from "../../components/navbar/navBar";
import Pricing from "./ui/pricing";


export default function PricingPage() {
    return (
        <main className="theme-bg min-h-screen">
            <NavbarDemo navItems={[
                { name: "Home", link: "/" },
            ]} />

            <Pricing />

            <Footer />
        </main>
    );
}