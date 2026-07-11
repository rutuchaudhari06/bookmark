import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSubjectByShareToken } from "../services/shareService";
import { createJoinRequest, findExistingRequest } from "../services/joinRequestService";
import { Button } from "../components/ui/button";

function JoinPage() {
  const { token } = useParams(); //to get the share token from the url params
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // null | "pending" | "collaborator" | "owner"
  const [requestStatus, setRequestStatus] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false); //used to track if join request reached to firebase

  useEffect(() => {
    const load = async () => {
      if (!token || !user) return;

      setLoading(true);
      setError("");

      try {
        const found = await getSubjectByShareToken(token);

        if (!found) {
          setError("Invalid or expired link.");
          setLoading(false);
          return;
        }

        setSubject(found);

        if (found.ownerId === user.uid) {
          setRequestStatus("owner");
        } else if (found.collaborators && found.collaborators.includes(user.uid)) {
          setRequestStatus("collaborator");
        } else {
          const existing = await findExistingRequest(found.id, user.uid);
          setRequestStatus(existing ? "pending" : null);
        }
      } catch (err) {
        console.error("Failed to load shared subject:", err);
        setError("Something went wrong loading this link.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  const handleRequestAccess = async () => {
    if (!subject || !user) return;

    setIsRequesting(true);
    try {
      await createJoinRequest(subject.id, user);
      setRequestStatus("pending");
    } catch (err) {
      console.error("Failed to request access:", err);
      setError("Unable to send request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading invite...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => navigate("/")}>Go home</Button>
      </div>
    );
  }

  // Owner or existing collaborator: no need to request, just go in.
  if (requestStatus === "owner" || requestStatus === "collaborator") {
    navigate(`/subject/${subject.id}`);
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3eee5] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#cfc4b3] bg-[#fbf7f0] p-6 text-center shadow-sm">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          {subject?.subjectName || "Shared folder"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared by folder owner
        </p>

        {requestStatus === "pending" ? (
          <p className="mt-6 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Your request has been sent. Waiting for the owner to approve.
          </p>
        ) : (
          <Button
            className="mt-6 w-full"
            onClick={handleRequestAccess}
            disabled={isRequesting}
          >
            {isRequesting ? "Requesting..." : "Request Access"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default JoinPage;