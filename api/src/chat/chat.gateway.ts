import { ClassSerializerInterceptor, SerializeOptions, UseInterceptors } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { SocketService } from "src/socket/socket.service";
import { ChatService } from "./chat.service";
import { GetAllMessagesDTO } from "./dto/getAllMessages.dto";
import { SendMessageDTO } from "./dto/sendMessage.dto";
import { JoinChannelDTO } from "./dto/joinChannel.dto";
import { ChannelsService } from "./channels.service";
import { instanceToPlain } from "class-transformer";

@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({
  strategy: 'excludeAll',
  exposeUnsetFields: false,
  excludeExtraneousValues: true
})
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: true,
    credentials: true
  }
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly socketService: SocketService,
    private readonly chatService: ChatService,
    private readonly channelService: ChannelsService
  ) {}

  //Be aware filters does not works on handleConnection !
  async handleConnection(socket: Socket) {
    try {
      const user = await this.socketService.getUserFromSocket(socket);
      socket.join(user.username);
    } catch (exception: any) {
      socket.emit('exception', {
        status: 'error',
        exception: 'Failed to connect'
      });
    }
  }

  // Message handling
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: SendMessageDTO
  ) {
    const author = await this.socketService.getUserFromSocket(socket);
    const receiveMessage = await this.chatService.sendMessage(author, message);
    
    this.server
      .to(message.target)
      .emit('receive_message', receiveMessage);
    return author.username;
  }

  @SubscribeMessage('get_all_messages')
  async getAllMessagesOfAuthor(
    @ConnectedSocket() socket: Socket,
    @MessageBody() getAllMessages: GetAllMessagesDTO
  ) {
    const author = await this.socketService.getUserFromSocket(socket);
    console.log('Get All Messages:', getAllMessages)
    return this.chatService.getAllMessages(author, getAllMessages);
  }

  // Channel handling

  @SubscribeMessage('create_channel')
  async createChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() channelAuth: JoinChannelDTO
  ) {
    const author = await this.socketService.getUserFromSocket(socket);

    const channel = await this.channelService.createChannel(author, channelAuth);
    this.server.to(author.username).socketsJoin(channel.name)
    this.server
      .to(channel.name)
      .emit('receive_create_channel', instanceToPlain(channel, {
        strategy: 'excludeAll',
        exposeUnsetFields: false,
        excludeExtraneousValues: true
      }));
  }

  @SubscribeMessage('join_channel')
  async joinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() joinChannelDto: JoinChannelDTO
  ) {
    const author = await this.socketService.getUserFromSocket(socket);

    const channel = await this.channelService.joinChannel(author, joinChannelDto);
    this.server.to(author.username).socketsJoin(channel.name);
    this.server.to(author.username).emit('receive_join_channel', {
      user: instanceToPlain(author, { strategy: 'excludeAll' }),
      channel: instanceToPlain(channel, {
        strategy: 'excludeAll',
        exposeUnsetFields: false,
        excludeExtraneousValues: true
      })
    })// For all client sockets
    this.server.to(channel.name).emit('receive_join_channel', {
      user: author.username,
      channel: channel.name
    });
  }

  @SubscribeMessage('get_all_channels')
  async getAllChannels(
    @ConnectedSocket() socket
  ) {
    const author = await this.socketService.getUserFromSocket(socket);

    const channels = await this.channelService.getAllChannels(author);
    return channels;
  }
}