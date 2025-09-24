import React, { useEffect } from "react";
import { useMeetingStore } from "@/hooks/use-meeting-store";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History, FileText } from "lucide-react";
import { format } from "date-fns";
export function PastMeetingsPage() {
  const { pastMeetings, fetchPastMeetings } = useMeetingStore();
  const [isLoading, setIsLoading] = React.useState(true);
  useEffect(() => {
    const loadMeetings = async () => {
      setIsLoading(true);
      await fetchPastMeetings();
      setIsLoading(false);
    };
    loadMeetings();
  }, [fetchPastMeetings]);
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Past Meetings</h1>
        <p className="text-slate-600">Review your previously recorded meetings and their AI-generated summaries.</p>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : pastMeetings.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {pastMeetings.map((meeting) => (
            <AccordionItem key={meeting.id} value={meeting.id} className="border rounded-lg bg-white shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-start gap-4 text-left w-full">
                  <History className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="font-semibold">Meeting from {format(new Date(meeting.createdAt), "PPP p")}</div>
                    <p className="text-sm text-slate-500 font-normal mt-1">{meeting.summary.summary.substring(0, 100)}...</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Full Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-md border">
                        {meeting.transcript}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-4">
                    <div><h3 className="font-semibold text-slate-800 mb-2">Summary</h3><p className="text-slate-700 leading-relaxed">{meeting.summary.summary}</p></div>
                    <div><h3 className="font-semibold text-slate-800 mb-2">Key Points</h3><ul className="list-disc list-inside space-y-1 text-slate-700">{meeting.summary.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ul></div>
                    <div><h3 className="font-semibold text-slate-800 mb-2">Action Items</h3><ul className="list-disc list-inside space-y-1 text-slate-700">{meeting.summary.actionItems.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
                    <div><h3 className="font-semibold text-slate-800 mb-2">Decisions Made</h3><ul className="list-disc list-inside space-y-1 text-slate-700">{meeting.summary.decisions.map((decision, i) => <li key={i}>{decision}</li>)}</ul></div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <History className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-slate-800">No past meetings</h3>
          <p className="mt-1 text-sm text-slate-500">Record your first meeting to see it here.</p>
        </div>
      )}
    </div>
  );
}