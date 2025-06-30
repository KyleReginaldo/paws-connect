import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const donations = [
  {
    id: 1,
    title: "Food Assistance",
    description: "Pambili ng bigas at de lata para sa mga stray feeders.",
    donated: 7500,
    target: 15000,
    createdBy: "Alhone Cruz",
    createdAt: "May 5, 2025",
    targetDate: "June 30, 2025",
  },
  {
    id: 2,
    title: "Medical Fund for Luna",
    description: "Surgery and medication for a rescued dog named Luna.",
    donated: 12000,
    target: 25000,
    createdBy: "Maria Dela Cruz",
    createdAt: "May 10, 2025",
    targetDate: "July 10, 2025",
  },
  {
    id: 3,
    title: "Shelter Roof Repair",
    description: "Repair damaged roof before rainy season hits.",
    donated: 18000,
    target: 30000,
    createdBy: "Kyle Reginaldo",
    createdAt: "May 15, 2025",
    targetDate: "July 1, 2025",
  },
  {
    id: 4,
    title: "Vaccine Drive",
    description: "Free vaccination for stray dogs and cats in Cavite.",
    donated: 5000,
    target: 20000,
    createdBy: "Jen Santos",
    createdAt: "May 20, 2025",
    targetDate: "August 5, 2025",
  },
  {
    id: 5,
    title: "Rescue Van Maintenance",
    description: "Oil change and tire replacement for rescue vehicle.",
    donated: 3500,
    target: 10000,
    createdBy: "Mark Javier",
    createdAt: "May 25, 2025",
    targetDate: "July 20, 2025",
  },
  {
    id: 6,
    title: "Adoption Kit Supplies",
    description: "Collars, leashes, and starter food for adopted pets.",
    donated: 8000,
    target: 12000,
    createdBy: "Liza Gonzales",
    createdAt: "May 28, 2025",
    targetDate: "July 15, 2025",
  },
];

export function DashboardDonationTable() {
  return (
    <Table className="bg-white">
      {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
      <TableHeader>
        <TableRow className="bg-[#fe5c2647]">
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Donated</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Created by</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead>Target date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {donations.map((donation, index) => {
          const even = index % 2 === 0;
          return (
            <TableRow
              key={donation.id}
              className={`${even ? "bg-gray-50" : null}`}
            >
              <TableCell className="font-medium">{donation.id}</TableCell>
              <TableCell>{donation.title}</TableCell>
              <TableCell>{donation.description}</TableCell>
              <TableCell>{donation.donated}</TableCell>
              <TableCell>{donation.target}</TableCell>
              <TableCell>{donation.createdBy}</TableCell>
              <TableCell>{donation.createdAt}</TableCell>
              <TableCell>{donation.targetDate}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
    </Table>
  );
}
