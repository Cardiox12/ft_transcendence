import { Socket } from "engine.io-client";
import { $Fetch } from "ohmyfetch";
import { User, UserInfos } from "./User.class";

interface FriendRelation {
  friend_id: string;
  user_1: UserInfos;
  user_2: UserInfos;
  pending: boolean;
}

interface BlockRelation {
  blocked_id: string;
  user_1: UserInfos;
  user_2: UserInfos;
}

export class UserAuthentified extends User {
  public friends: User[] = [];
  public pendingFriends: User[] = [];
  public blockedUsers: User[] = [];
  public matchId: Number;
  public gameSocket: any;

  constructor(username: string, fetchingMethod: $Fetch) {
    super(username, fetchingMethod);
  }

  /* Overload method */
  public async fetchAll() {
    await super.fetchAll();
    this.pendingFriends.forEach(friend => friend.fetchAll());
    this.friends.forEach(friend => friend.fetchAll());
    this.blockedUsers.forEach(user => user.fetchAll());
    return this;
  }

  /* USER INTERFACE */
  /* -------------------------------------------------------------- */
  public async updateAvatar(newAvatar: any) { //TODO modif type
    await this.fetchingMethod(`/avatar/me`,
      {
        method: 'PUT',
        body: newAvatar,
      }
    );

  }

  public async updateUsername(newUsername: string) {
    console.log(newUsername),
      await this.fetchingMethod(`/me`, {
        method: 'PUT',
        body: {
          username: newUsername,
        },
      }
      ).then(async () => {
        this.username = newUsername;
        await this.fetchAll()
      })
  }

  public async updateDoubleAuth(enable: boolean) { }


  /* FRIEND INTERFACE */
  /* -------------------------------------------------------------- */
  public async addFriend(target: User | string) {
    await this.fetchingMethod(
      `/friends/me/${this.extractUsername(target)}`,
      { method: 'POST' }
    );
  }

  public async acceptFriend(target: User | string) {
    await this.fetchingMethod(
      `/friends/me/${this.extractUsername(target)}`, {
      method: 'PUT',
      body: {
        pending: false
      }
    }
    );
  }

  public async deleteFriend(username: User | string) {
    await this.fetchingMethod(
      `/friends/me/${this.extractUsername(username)}`,
      { method: 'DELETE' }
    );
  }

  public async getFriends(pending: boolean = false) {
    return await this.fetchingMethod(`/friends/me?pending=${pending}`);
  }

  public async getFriendsRequest() {
    return await this.fetchingMethod(`/friends/me/request`);
  }


  /* BLOCK INTERFACE */
  /* -------------------------------------------------------------- */
  public async blockUser(target: User | string) {
    await this.fetchingMethod(
      `/blocked/me/${this.extractUsername(target)}`,
      { method: 'POST' }
    );
  }

  public async unblockUser(target: User | string) {
    await this.fetchingMethod(
      `/blocked/me/${this.extractUsername(target)}`,
      { method: 'DELETE' }
    );
  }

  public async isBlockUser(target: User | string) {
    const booleanString = await this.fetchingMethod(`/blocked/me/${this.extractUsername(target)}`);
    return booleanString === 'true';
  }
  
  
  /* GAME */
  /* -------------------------------------------------------------- */
  public generateGameSocket() {
    this.gameSocket = useSocketGame();
  }

  /* UTILS */
  /* -------------------------------------------------------------- */


  public extractFriend(relation: FriendRelation) {
    return relation.user_2.username != this.username ? relation.user_2 : relation.user_1;
  }

  public isInGame() : Boolean {
    return (this.gameSocket && this.matchId ? true : false)
  }

}
