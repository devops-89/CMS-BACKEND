import { Html, Body, Container, Text, Heading } from "@react-email/components";

interface Props {
  otp: string;
  name?: string;
}

export const OtpTemplate = ({ otp, name }: Props) => {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Hello {name || "User"}</Heading>
          <Text>Your OTP is:</Text>
          <Heading>{otp}</Heading>
          <Text>This OTP expires in 5 minutes.</Text>
        </Container>
      </Body>
    </Html>
  );
};
