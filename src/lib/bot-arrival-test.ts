export type ArrivalResult = {
  ok: boolean;
  mode: 'receiver';
  message: string;
  sentText: string;
  receivedText: string | null;
  receivedAt: string | null;
  requestId: string;
  httpStatus: number | null;
  cleanedUp: boolean;
};

export function confirmsArrival(sent: string, received: { text: string; direction: string; kind: string } | null) {
  return received?.text === sent && received.direction === 'bot' && received.kind === 'text';
}