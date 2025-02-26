"use client";

import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { EmptySearch } from "./empty-search";
import { EmptyFavorites } from "./empty-favorite";
import { EmptyBoards } from "./empty-board";

interface BoardListProps {
  orgId: string;
  query: {
    search?: string;
    favorites?: string;
  };
}

export const BoardList = ({ orgId, query }: BoardListProps) => {
  // ✅ Replace this with actual fetched data
  const data = useQuery(api.boards.get,{orgId}); // Hardcoded empty array (Replace with API data)

  if(data === undefined){
    return (
        <div>
            Loading...
        </div>
    )
  }

  // ✅ Fix: Ensure `query.search` exists & is not empty
  if (!data.length && query.search?.trim()) {
    return (<EmptySearch />);
  }

  if (!data.length && query.favorites) {
    return (
        <EmptyFavorites/>
    );
  }

  if (!data?.length) {
    return (
        <EmptyBoards/>
    );
  }

  return (
    <div>
      <h2 className="text-3xl">
        {(query.favorites ? "favorite boards" : "Team boards")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">

      </div>
    </div>
  )
};
