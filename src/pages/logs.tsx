import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let q = query(
      collection(db, "activity_logs"),
      orderBy("created_at", "desc")
    );

    if (fromDate) {
      q = query(
        q,
        where("created_at", ">=", Timestamp.fromDate(new Date(fromDate)))
      );
    }

    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);

      q = query(
        q,
        where("created_at", "<=", Timestamp.fromDate(endOfDay))
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(data);
    });

    return () => unsubscribe();
  }, [fromDate, toDate]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold ml-2 md:ml-6">Activity Logs</h1>
      </div>

      {/* DATE FILTERS */}
      <Card>
        <CardContent className="flex flex-col md:flex-row gap-4 p-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">From Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">To Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LOG TABLE */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-gray-600" />
            All Activity Logs
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No activity logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">Entity</th>
                    <th className="px-4 py-2 text-left">Details</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => {
                    const dateObj = log.created_at?.toDate();

                    return (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {dateObj?.toLocaleDateString()}
                        </td>

                        <td className="px-4 py-2">
                          {dateObj?.toLocaleTimeString()}
                        </td>

                        <td className="px-4 py-2 font-medium">
                          {log.performed_by || "System"}
                        </td>

                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold
                              ${
                                log.action === "CREATE"
                                  ? "bg-green-100 text-green-700"
                                  : log.action === "UPDATE"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="px-4 py-2 text-gray-700">
                          {log.entity}
                        </td>

                        <td className="px-4 py-2 text-gray-700">
                          {log.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
