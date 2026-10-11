import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MessageCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

/** Compact card for auth states: email sent, verify results, invalid links. */
export function MessageCard({
  title,
  description,
  children,
}: MessageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children ? <CardFooter>{children}</CardFooter> : null}
    </Card>
  );
}
