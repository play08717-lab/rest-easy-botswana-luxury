import roomExecutive from "@/assets/room-executive.jpg";
import roomMaster from "@/assets/room-master.jpg";
import roomGarden from "@/assets/room-garden.jpg";
import type { Apartment } from "@/components/ApartmentCard";

export const apartments: Apartment[] = [
  {
    slug: "executive-studio",
    name: "The Executive Studio",
    eyebrow: "Signature",
    description:
      "A refined studio for the solo traveller or couple, dressed in crisp linen and warm lamplight.",
    features: ["Queen bed", "Private en-suite", "Kitchenette", "Private entrance"],
    priceFrom: "On request",
    image: roomExecutive,
  },
  {
    slug: "master-apartment",
    name: "The Master Apartment",
    eyebrow: "Most spacious",
    description:
      "Our most generous residence, with a full kitchen and dining nook — designed for longer stays.",
    features: ["King bed", "Full kitchen", "Living & dining area", "Private patio"],
    priceFrom: "On request",
    image: roomMaster,
  },
  {
    slug: "garden-suite",
    name: "The Garden Suite",
    eyebrow: "Garden-facing",
    description:
      "A quiet suite opening onto the garden courtyard — the calmest corner of the property.",
    features: ["Queen bed", "En-suite bathroom", "Kitchenette", "Garden view"],
    priceFrom: "On request",
    image: roomGarden,
  },
];
