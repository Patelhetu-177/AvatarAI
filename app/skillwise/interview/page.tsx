// app/interview/new/page.tsx
import { getCurrentUser } from "@/lib/actions/auth.action";
import InterviewForm from "@/components/InterviewForm";

const CreateInterviewPage = async () => {
  const user = await getCurrentUser();

  return (
    <>
      {/* <h3>Create Interview</h3> */}
      <InterviewForm
        userName={user?.name ?? "Guest"}
        userId={user?.id}
        email={user?.email ?? ""}
      />
    </>
  );
};

export default CreateInterviewPage;
