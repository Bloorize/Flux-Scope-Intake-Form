import { DiscoveryForm } from "../../components/discovery-form";
import { PasswordGate } from "../../components/password-gate";

export default function VerdeScopePage() {
  return (
    <PasswordGate>
      <DiscoveryForm />
    </PasswordGate>
  );
}
