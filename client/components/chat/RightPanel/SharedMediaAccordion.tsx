import { FileImage } from "lucide-react";
import Accordion from "./Accordion";
import { Attachment } from "@/types";

interface SharedMediaAccordionProps {
  conversationId: string;
}

// Dummy data for now, replace with actual API call
const DUMMY_MEDIA: Attachment[] = [
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRJThR1LULjyZQ23zb0vjCAWMsDKYWj080Rp8E0cpV5aIBTUcnnn5IWY-ry8HjIH65faB1-o7-i8PFQRcK6it3QZE2rMir5au0qssbF09HDYtvB8nKBBxmsgNl7O3Grnm7RhjBX3U1ELxK0iJEAAqxGom4HyTXS9CTolGA6z59XghFPpnV9BGea1oq0dwm7xWvoXstq6iw6pDnSIQMOb5N2dUeYciqs7cRC8IjJDDrJ8jWr_4hHgvYG34R18Ffi9JrRxck2l7ciIsy",
    type: "image",
    name: "image1.jpg",
    size: 1024,
    format: "jpg",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx3pJo_eJB-NZeBzJrhRpMCsJAVh_hlcsm_5iKEtNhn3v3isDAxOgJUU6JwEvNTDzMCtJXNvOLfCv_wljSZv8ovx3Bcq_NkoqmKyvOX8U8yLYzaLF0kIeN_MJgtL5MjPw7awR368PeVSUojYgqpgyydQXwY9FCCNcu1oK9HN_bBLrAKTR861yekIOc8Lb_MVMguorAX_1QNdAg88Rd4vm0t67kDotlwwrmX_YlNWHcsKfQ1rjZPwW3lnnhroiDYpNZ9YbAEj4DE2XH",
    type: "image",
    name: "image2.png",
    size: 2048,
    format: "png",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuArXxove9ULc392OMRG_JV_AURtpfMSItjN8zvKBUFxFCtWV4MexMrK7ZYP8IPJVlVElU4bUBqYCLC8Hq4lPNkGnAbfgcjgmr6F12XOYF_eDSq9TI59JXMHI6i0bviMvoLI48p015VHmusi9E1WuyNGJECWLSqK4IimvID6pTsyxunLDd-SzByDdL8ZYl0DUADaQCJRQW8Dt8uHHWAezqMT1sHRrqUqDCYKaiL2TkjlDDBBVBC7EeAVfjl8DMxj_U7RSghK0-9S1zgK",
    type: "image",
    name: "image3.jpeg",
    size: 1536,
    format: "jpeg",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAf_FSpOE2n8s2jbqQmLdh2qW33IxHRBvijJLViqtqpZHbIr7Xpb_wAxpJur220ZDmIQaN2dlfWrmE3YEBwqubX3H7gR7jm5_mkxOYmOssMCr3yjFlXoUOtPdFtx4EIND66z81lHlOR2ZEL6pxKSTqqFTBhf0xAfeIMlOgYFZG1NmKvzlbarHTsaRdkEUmKJ30_3v6TIoitzHM-u8v-ZEwQxemNC-CAqwKJ2ZngtNCectmWa_9XukbGdXn2r2MKQiqFi-wxbIjn8lB4",
    type: "image",
    name: "image4.gif",
    size: 512,
    format: "gif",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_C29QFhMiZQ1tiFlYDm_DQS9t7kCj7fbefc1z0dUwwnXCerUM1Qunb1s374Mm-WaRCzL3VP-AfA3QSiQTQX67pXErelBoPDAja9jMtsPJ8O2orgG-4PteM2E7IBPWtoGjr-ZqbVVwcNn4qPE-RHWfPKj7BkadwCamE6PBJmnCJbSggviRPV58YNBoS0bhURTTGiRp8OPjCZDlxPtfS462YJl3BpmE78VlCMYbhkZ2-g5eJIHWAnl6L_gJMoVIGBBaAdvhb9_K68SJ",
    type: "image",
    name: "image5.bmp",
    size: 256,
    format: "bmp",
  },
];

export default function SharedMediaAccordion({ conversationId }: SharedMediaAccordionProps) {
  const mediaImages = DUMMY_MEDIA.filter((media) => media.type === "image");

  return (
    <Accordion icon={<FileImage />} title="Shared Media">
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-2 my-3">
          {mediaImages.map((img) => (
            <div
              key={img.url} // Using url as key for now, ideally should be a unique ID from backend
              className="aspect-square rounded-lg bg-cover bg-center cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundImage: `url("${img.url}")` }}
              role="img"
              aria-label={img.name}
            />
          ))}
          <button className="aspect-square rounded-lg bg-gray flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
            <span className="text-xs font-bold text-slate-500">+112</span>
          </button>
        </div>
      </div>
    </Accordion>
  );
}
