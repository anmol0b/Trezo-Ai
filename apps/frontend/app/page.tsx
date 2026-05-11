// import Image, { type ImageProps } from "next/image";
import "./globals.css"
import LandingPage from "../components/landing/LandingPage";
// import { HeroSection } from "../components/coming-soon/hero";

// type Props = Omit<ImageProps, "src"> & {
//   srcLight: string;
//   srcDark: string;
// };

// const ThemeImage = (props: Props) => {
//   const { srcLight, srcDark, ...rest } = props;

//   return (
//     <>
//       <Image {...rest} src={srcLight} className="imgLight" />
//       <Image {...rest} src={srcDark} className="imgDark" />
//     </>
//   );
// };

export default function Home() {
  return (
    <div>
      <LandingPage />
      {/* <HeroSection /> */}
    </div>
  );
}
