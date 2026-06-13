import OracleLayout from "../components/OracleLayout";
import ChatArea from "../components/ChatArea";
import { ChatProvider } from "../context/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <OracleLayout>
        <ChatArea />
      </OracleLayout>
    </ChatProvider>
  );
}
