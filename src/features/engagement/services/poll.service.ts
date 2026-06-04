import { doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getFirebaseFirestore } from "../../../lib/firebase";
import { hasFirebaseConfig } from "../../../lib/env";
import type { TimestampLike } from "../../../types/domain";

export type PollOption = {
  id: string;
  label: string;
};

export type PollItem = {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  status: 'draft' | 'active' | 'closed';
  targetProgramId?: string;
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  closedAt?: TimestampLike;
};

export type VoteItem = {
  voteId: string;
  optionId: string;
  userId?: string;
  anonymousSessionId?: string;
  createdAt: TimestampLike;
};

const isTestOrNoFirebase = () => {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
};

const getLocalPolls = (): PollItem[] => {
  const data = localStorage.getItem("broadcast_polls");
  return data ? JSON.parse(data) : [];
};

const saveLocalPolls = (polls: PollItem[]) => {
  localStorage.setItem("broadcast_polls", JSON.stringify(polls));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("polls_changed"));
  }
};

const getLocalVotes = (pollId: string): VoteItem[] => {
  const data = localStorage.getItem(`poll_votes_${pollId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalVotes = (pollId: string, votes: VoteItem[]) => {
  localStorage.setItem(`poll_votes_${pollId}`, JSON.stringify(votes));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(`votes_changed_${pollId}`));
  }
};

export async function createPoll(
  title: string,
  options: string[],
  createdBy: string,
  targetProgramId?: string
): Promise<PollItem> {
  const pollId = `poll-${Date.now()}`;
  const pollOptions: PollOption[] = options.map((label, idx) => ({
    id: `opt-${idx}-${Math.random().toString(36).substr(2, 5)}`,
    label
  }));

  const newPoll: PollItem = {
    pollId,
    title,
    options: pollOptions,
    status: 'active',
    targetProgramId,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isTestOrNoFirebase()) {
    const list = getLocalPolls();
    list.unshift(newPoll);
    saveLocalPolls(list);
    return newPoll;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "broadcastPolls", pollId);
    await setDoc(docRef, {
      ...newPoll,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newPoll;
  } catch (error) {
    console.warn("[poll.service] createPoll failed", error);
    throw error;
  }
}

export async function closePoll(pollId: string): Promise<void> {
  if (isTestOrNoFirebase()) {
    const list = getLocalPolls();
    const idx = list.findIndex(p => p.pollId === pollId);
    if (idx !== -1) {
      const now = new Date().toISOString();
      list[idx] = {
        ...list[idx],
        status: "closed",
        closedAt: now,
        updatedAt: now
      };
      saveLocalPolls(list);
    }
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "broadcastPolls", pollId);
    await updateDoc(docRef, {
      status: "closed",
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("[poll.service] closePoll failed", error);
    throw error;
  }
}

export async function checkHasVoted(
  pollId: string,
  userId?: string,
  anonymousSessionId?: string
): Promise<boolean> {
  if (!userId && !anonymousSessionId) return false;

  if (isTestOrNoFirebase()) {
    const votes = getLocalVotes(pollId);
    return votes.some(v => v.userId === userId || v.anonymousSessionId === anonymousSessionId);
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "broadcastPolls", pollId, "votes");
    let q;
    if (userId) {
      q = query(colRef, where("userId", "==", userId));
    } else {
      q = query(colRef, where("anonymousSessionId", "==", anonymousSessionId));
    }
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.warn("[poll.service] checkHasVoted failed", error);
    return false;
  }
}

export async function submitVote(
  pollId: string,
  optionId: string,
  userId?: string,
  anonymousSessionId?: string
): Promise<boolean> {
  const hasVoted = await checkHasVoted(pollId, userId, anonymousSessionId);
  if (hasVoted) {
    return false;
  }

  const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newVote: VoteItem = {
    voteId,
    optionId,
    userId,
    anonymousSessionId,
    createdAt: new Date().toISOString()
  };

  if (isTestOrNoFirebase()) {
    const list = getLocalVotes(pollId);
    list.push(newVote);
    saveLocalVotes(pollId, list);
    return true;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "broadcastPolls", pollId, "votes", voteId);
    await setDoc(docRef, {
      ...newVote,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn("[poll.service] submitVote failed", error);
    throw error;
  }
}

export function subscribeActivePolls(callback: (polls: PollItem[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      const active = getLocalPolls().filter(p => p.status === 'active' || p.status === 'closed');
      callback(active);
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("polls_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("polls_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "broadcastPolls");
    const q = query(colRef, where("status", "in", ["active", "closed"]));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          pollId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as PollItem;
      });
      callback(list);
    }, (error) => {
      console.warn("[poll.service] subscribeActivePolls error", error);
    });
  } catch (error) {
    console.warn("[poll.service] subscribeActivePolls failed to start", error);
    return () => {};
  }
}

export function subscribePollVotes(pollId: string, callback: (votes: VoteItem[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      callback(getLocalVotes(pollId));
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener(`votes_changed_${pollId}`, trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`votes_changed_${pollId}`, trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "broadcastPolls", pollId, "votes");
    return onSnapshot(colRef, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          voteId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as VoteItem;
      });
      callback(list);
    }, (error) => {
      console.warn("[poll.service] subscribePollVotes error", error);
    });
  } catch (error) {
    console.warn("[poll.service] subscribePollVotes failed to start", error);
    return () => {};
  }
}
