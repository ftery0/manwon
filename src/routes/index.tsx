import { Hero } from "~/components/landing/Hero";
import { F1Section, F2Section } from "~/components/landing/FeatureSection";
import { DataSourceNote } from "~/components/landing/DataSourceNote";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <F1Section />
      <F2Section />
      <DataSourceNote />
    </>
  );
}
