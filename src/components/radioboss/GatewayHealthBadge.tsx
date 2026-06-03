import { Router, WifiOff } from "lucide-react";
import {
  formatRelativeTime,
  getGatewayHeartbeatTime,
  resolveHeartbeatState,
  type RadioBossGatewayHeartbeat
} from "../../services/radioboss/radiobossStatus.service";

type GatewayHealthBadgeProps = {
  heartbeat: RadioBossGatewayHeartbeat | null;
};

const stateLabel = {
  online: "Online",
  warning: "Terlambat",
  offline: "Offline"
};

export function GatewayHealthBadge({ heartbeat }: GatewayHealthBadgeProps) {
  const state = resolveHeartbeatState(heartbeat);
  const Icon = state === "offline" ? WifiOff : Router;
  const gatewayId = heartbeat?.gatewayId || "studio-main";
  const lastHeartbeat = getGatewayHeartbeatTime(heartbeat);
  const safeError = heartbeat?.errorMessageSafe ?? heartbeat?.lastError ?? "";

  return (
    <article className={`radioboss-health-badge is-${state}`}>
      <span className="radioboss-health-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="radioboss-health-copy">
        <span>Studio Gateway</span>
        <strong>{stateLabel[state]}</strong>
        <small>{gatewayId} - {formatRelativeTime(lastHeartbeat)}</small>
        {safeError && state !== "online" && <em>{safeError}</em>}
      </span>
    </article>
  );
}
