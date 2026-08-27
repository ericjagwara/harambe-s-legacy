import afban from "@/assets/p-afban.png.asset.json";
import fieconsult from "@/assets/p-fieconsult.png.asset.json";
import imuka from "@/assets/p-imuka.png.asset.json";
import konnect from "@/assets/p-konnect.png.asset.json";
import offisar from "@/assets/p-offisar.png.asset.json";
import ortus from "@/assets/p-ortus.png.asset.json";

export type Partner = { name: string; logo: string };

export const PARTNERS: Partner[] = [
  { name: "Imuka Access", logo: imuka.url },
  { name: "Fie-Consult", logo: fieconsult.url },
  { name: "Ortus Africa Capital", logo: ortus.url },
  { name: "Konnect Initiative", logo: konnect.url },
  { name: "African Federation of Business Angels Networks", logo: afban.url },
  { name: "Offisar, The Virtual Remote Office", logo: offisar.url },
];
