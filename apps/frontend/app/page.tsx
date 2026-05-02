import Image, { type ImageProps } from "next/image";
import "./globals.css"
import Hero from "../components/hero";
import Landing from "../pages/landing";
// import { HeroSection } from "../components/coming-soon/hero";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="imgLight" />
      <Image {...rest} src={srcDark} className="imgDark" />
    </>
  );
};

export default function Home() {
  return (
    <div>
      {/* <Landing /> */}
      {/* <HeroSection /> */}
    </div>
  );
}
