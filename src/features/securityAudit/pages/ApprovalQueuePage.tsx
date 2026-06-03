import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { ApprovalCard } from "../components/ApprovalCard";
import { subscribeApprovalQueue, processApprovalRequest } from "../services/approval.service";
import type { ApprovalRequest } from "../../../types/domain";
import type { AuthSession } from "../../../services/auth.service";
import { CheckSquare, ListTodo, AlertTriangle } from "lucide-react";
import "../styles/securityAudit.css";

type ApprovalQueuePageProps = {
  session: AuthSession | null;
};

export default function ApprovalQueuePage({ session }: ApprovalQueuePageProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Jalankan realtime subscription untuk approval queue
    const unsubscribe = subscribeApprovalQueue((newRequests) => {
      setRequests(newRequests);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleApprove = async (id: string, note: string) => {
    if (!session?.user) return;
    setProcessingId(id);
    try {
      await processApprovalRequest({
        approvalId: id,
        status: "approved",
        reviewerUserId: session.user.id,
        reviewerUserName: session.user.displayName || "Admin",
        reviewerUserRole: session.user.role,
        reviewNote: note
      });
    } catch (err) {
      console.error("Gagal menyetujui pengajuan:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, note: string) => {
    if (!session?.user) return;
    setProcessingId(id);
    try {
      await processApprovalRequest({
        approvalId: id,
        status: "rejected",
        reviewerUserId: session.user.id,
        reviewerUserName: session.user.displayName || "Admin",
        reviewerUserRole: session.user.role,
        reviewNote: note
      });
    } catch (err) {
      console.error("Gagal menolak pengajuan:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");

  const visibleRequests = activeTab === "pending" ? pendingRequests : historyRequests;

  return (
    <>
      <PageHeader
        eyebrow="Otorisasi Studio"
        title="Antrean Persetujuan"
        description="Verifikasi dan otorisasi pengajuan perubahan sensitif, publikasi konten, ekspor lokasi presisi pendengar, serta pengiriman notifikasi siaran stasiun SBL."
      />

      <div className="sec-approval-content">
        {/* Tab Navigasi */}
        <div className="sec-approval-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`sec-approval-tab-btn ${activeTab === "pending" ? "active" : ""}`}
          >
            <ListTodo size={15} />
            Menunggu Persetujuan ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`sec-approval-tab-btn ${activeTab === "history" ? "active" : ""}`}
          >
            <CheckSquare size={15} />
            Riwayat Otorisasi ({historyRequests.length})
          </button>
        </div>

        {loading ? (
          <div className="sec-audit-spinner">
            <div className="spinner-small"></div>
            <span>Memuat antrean persetujuan...</span>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="sec-audit-empty-state">
            <AlertTriangle size={36} />
            <h3>
              Tidak ada pengajuan {activeTab === "pending" ? "aktif yang menunggu persetujuan" : "di riwayat"}.
            </h3>
            <p>Sistem dalam keadaan optimal.</p>
          </div>
        ) : (
          <div className="sec-approval-list">
            {visibleRequests.map((req) => (
              <ApprovalCard
                key={req.id}
                request={req}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={processingId === req.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
