import { Injectable } from "@nestjs/common";
import { AuthService } from "src/auth/auth.service";
import { Socket } from "socket.io";
import { WsException } from "@nestjs/websockets";
import { parse } from "cookie";
import { UsersService } from "src/users/users.service";
import { WsUserNotFoundException } from "./exceptions/wsUserNotFound";
import { UserEntity } from "src/users/entities/user.entity";
import { WsUserNotConnected } from "./exceptions/wsUserNotConnected";

@Injectable()
export class SocketService {
  // Map of connected users to their sockets.id
  private connectedUsers = new Map<string, UserEntity>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService
  ) {}

  async connectUserWithSocket(socket: Socket) {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies)
      throw new WsUserNotConnected();
    const { Authentication: token } = parse(cookies);
    if (!token)
      throw new WsUserNotConnected();
    const user = await this.authService.getUserFromAuthenticationToken(token);
    if (!user)
      throw new WsException('Invalid credentials');
    
    this.connectedUsers.set(socket.id, user);
    console.log('User', user.username, 'connected');
    console.log(this.connectedUsers);
    return user;
  }

  async disconnectSocketBindedToUser(socket: Socket) {
    this.connectedUsers.delete(socket.id);
  }

  async getUserFromSocket(socket: Socket) {
    const user = this.connectedUsers.get(socket.id);
    if (!user)
      return this.connectUserWithSocket(socket);
    return user;
  }

  async getUserByName(username: string) {
    try {
      return await this.userService.findOneByName(username);
    } catch(error) {
      throw new WsUserNotFoundException(username);
    }
  }
}