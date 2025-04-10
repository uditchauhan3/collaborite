"use client";

import { useEffect } from "react";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { EmptyOrg } from "./_components/empty-org";
import { BoardList } from "./_components/board-list";

interface DashboardPageProps {
  searchParams: {
    search?: string;
    favorites?: string;
  };
}

const DashboardPage = ({ searchParams }: DashboardPageProps) => {
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList();

  useEffect(() => {
    if (!organization && userMemberships?.data?.length && setActive) {
      const firstOrg = userMemberships.data[0].organization;
      if (firstOrg) {
        setActive({ organization: firstOrg.id });
      }
    }
  }, [organization, userMemberships, setActive]);

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      {!organization ? (
        <EmptyOrg />
      ) : (
        <BoardList orgId={organization.id} query={searchParams} />
      )}
    </div>
  );
};

export default DashboardPage;
