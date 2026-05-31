import type { Metadata } from "next";

import ContactsPage from "@/components/contacts/ContactsPage";
import { privatePageRobots } from "../../seo";

export const metadata: Metadata = {
  title: "Contacts",
  description:
    "Manage Connect friends, pending requests, and contact details.",
  robots: privatePageRobots,
};

export default function ContactsRoute() {
  return <ContactsPage />;
}
