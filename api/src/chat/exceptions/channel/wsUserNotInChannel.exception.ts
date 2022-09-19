import { WsException } from "@nestjs/websockets";

export class WsUserNotInChannelException extends WsException {
  constructor(username: string, channel_name: string) {
    super(`${username} is not in ${channel_name}`);
  }
}