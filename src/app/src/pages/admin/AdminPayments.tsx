import { DollarSign, TrendingUp, Download, Filter } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useState, useEffect } from "react";
import { getAllBookings } from "../../lib/db/bookings";
import { getAllWorkshopBookings } from "../../lib/db/workshop-bookings";
import { getAllUsers } from "../../lib/db/users";
import { getAllServices } from "../../lib/db/services";
import { getAllWorkshops } from "../../lib/db/workshops";
import { Booking, PaymentStatus } from "../../schema/booking.schema";
import { WorkshopBooking } from "../../schema/workshop-booking.schema";
import { User } from "../../schema/user.schema";
import { Service } from "../../schema/service.schema";
import { Workshop } from "../../schema/workshop.schema";

type Transaction = {
  id: string;
  date: string;
  client: string;
  service: string;
  amount: number;
  status: string;
  method: string;
  type: "session" | "workshop";
  paymentStatus: PaymentStatus | string;
};

export function AdminPayments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    weekRevenue: 0,
    pendingRevenue: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const [bookings, workshopBookings, users, services, workshops] =
        await Promise.all([
          getAllBookings(),
          getAllWorkshopBookings(),
          getAllUsers(),
          getAllServices(),
          getAllWorkshops(),
        ]);

      // Create maps for quick lookup
      const userMap = new Map(users.map((u) => [u.id, u]));
      const serviceMap = new Map(services.map((s) => [s.id, s]));
      const workshopMap = new Map(workshops.map((w) => [w.id, w]));

      // Convert bookings to transactions
      const bookingTransactions: Transaction[] = bookings.map((booking) => ({
        id: booking.id || "",
        date: new Date(booking.appointment_date).toISOString().split("T")[0],
        client: userMap.get(booking.user_id)?.full_name || "Unknown",
        service: serviceMap.get(booking.service_id)?.name || "Unknown Service",
        amount: booking.total_price,
        status: booking.status,
        method: "Stripe",
        type: "session" as const,
        paymentStatus: booking.payment_status,
      }));

      // Convert workshop bookings to transactions
      const workshopTransactions: Transaction[] = workshopBookings.map(
        (wb) => ({
          id: wb.id || "",
          date: new Date(wb.workshop_date).toISOString().split("T")[0],
          client: wb.participant_name,
          service: workshopMap.get(wb.workshop_id)?.title || "Unknown Workshop",
          amount: wb.total_amount,
          status: wb.booking_status,
          method: "Stripe",
          type: "workshop" as const,
          paymentStatus: wb.payment_status,
        }),
      );

      // Combine and sort by date (newest first)
      const allTransactions = [
        ...bookingTransactions,
        ...workshopTransactions,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);

      // Calculate stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalRevenue = allTransactions
        .filter(
          (t) =>
            t.paymentStatus === PaymentStatus.PAID ||
            t.paymentStatus === "paid",
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const weekRevenue = allTransactions
        .filter(
          (t) =>
            (t.paymentStatus === PaymentStatus.PAID ||
              t.paymentStatus === "paid") &&
            new Date(t.date) >= oneWeekAgo,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingRevenue = allTransactions
        .filter(
          (t) =>
            t.paymentStatus === PaymentStatus.PENDING ||
            t.paymentStatus === "pending",
        )
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalRevenue,
        weekRevenue,
        pendingRevenue,
        transactionCount: allTransactions.length,
      });
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      label: "Total Revenue",
      value: `£${stats.totalRevenue?.toFixed(2)}`,
      change: "+18%",
    },
    {
      label: "This Week",
      value: `£${stats.weekRevenue?.toFixed(2)}`,
      change: "+12%",
    },
    {
      label: "Pending",
      value: `£${stats.pendingRevenue?.toFixed(2)}`,
      change: "-5%",
    },
    {
      label: "Transactions",
      value: `${stats.transactionCount}`,
      change: "+22%",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-800 mb-2">Payments & Transactions</h1>
          <p className="text-gray-600">Track revenue and payment history</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="flex items-center gap-2 border-2"
            style={{
              borderColor: "#DCD4CD",
              color: "#3D3935",
              backgroundColor: "transparent",
            }}
          >
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button
            className="flex items-center gap-2 border-2"
            style={{
              backgroundColor: "#E9CFCA",
              borderColor: "#3D3935",
              color: "#3D3935",
            }}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat) => (
          <Card
            key={stat.label}
            className="p-6 border-2"
            style={{ borderColor: "#DCD4CD" }}
          >
            <div className="flex items-start justify-between mb-2">
              <DollarSign className="w-5 h-5" style={{ color: "#3D3935" }} />
              <span
                className={`text-sm font-semibold ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold" style={{ color: "#3D3935" }}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="p-6 mb-8 border-2" style={{ borderColor: "#DCD4CD" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: "#3D3935" }}>Revenue Overview</h3>
          <TrendingUp className="w-5 h-5" style={{ color: "#3D3935" }} />
        </div>
        <div
          className="h-64 flex items-center justify-center"
          style={{ backgroundColor: "#FAF7F5" }}
        >
          <p className="text-gray-500">Chart visualization coming soon</p>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card
        className="border-2 overflow-hidden"
        style={{ borderColor: "#DCD4CD" }}
      >
        <div className="p-6 border-b-2" style={{ borderColor: "#DCD4CD" }}>
          <h3 style={{ color: "#3D3935" }}>Recent Transactions</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-600">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#FAF7F5" }}>
                <tr className="border-b-2" style={{ borderColor: "#DCD4CD" }}>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Transaction ID
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Date
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Client
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Service
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Workshops
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Amount
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Method
                  </th>
                  <th className="text-left p-4" style={{ color: "#3D3935" }}>
                    Payment Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b hover:bg-gray-50"
                    style={{ borderColor: "#DCD4CD" }}
                  >
                    <td className="p-4">
                      <span
                        className="font-mono text-sm"
                        style={{ color: "#3D3935" }}
                      >
                        {transaction.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(transaction.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4" style={{ color: "#3D3935" }}>
                      {transaction.client}
                    </td>
                    <td className="p-4 text-gray-600">
                      {transaction.type === "session"
                        ? transaction.service
                        : "-"}
                    </td>
                    <td className="p-4 text-gray-600">
                      {transaction.type === "workshop"
                        ? transaction.service
                        : "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className="font-semibold"
                        style={{ color: "#3D3935" }}
                      >
                        £{transaction.amount?.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {transaction.paymentStatus === "paid"
                        ? transaction.method
                        : "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className="px-3 py-1 text-sm font-semibold"
                        style={{
                          backgroundColor:
                            transaction.paymentStatus === PaymentStatus.PAID ||
                            transaction.paymentStatus === "paid"
                              ? "#E9CFCA"
                              : transaction.paymentStatus ===
                                    PaymentStatus.PENDING ||
                                  transaction.paymentStatus === "pending"
                                ? "#F1DFC0"
                                : transaction.paymentStatus ===
                                      PaymentStatus.FAILED ||
                                    transaction.paymentStatus === "failed"
                                  ? "#DCD4CD"
                                  : "#EADDD5",
                          color: "#3D3935",
                        }}
                      >
                        {typeof transaction.paymentStatus === "string"
                          ? transaction.paymentStatus.charAt(0).toUpperCase() +
                            transaction.paymentStatus.slice(1)
                          : transaction.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
