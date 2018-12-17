import * as _ from "lodash";
import { Store } from "redux";
import { isKeystoreExisted } from "../../src/model/keystore";
import { ReducerConfigure } from "../../src/redux";
import accountActions from "../../src/redux/account/accountActions";
import assetActions from "../../src/redux/asset/assetActions";
import walletActions from "../../src/redux/wallet/walletActions";

enum Actions {
  getNetworkId = "getNetworkId",
  isAuthenticated = "isAuthenticated",
  getAvailableQuark = "getAvailableQuark",
  getAvailableAssets = "getAvailableAssets",
  getPlatformAddresses = "getPlatformAddresses",
  getAssetAddresses = "getAssetAddresses"
}

const needAuthActions = [
  Actions.getAvailableQuark,
  Actions.getAvailableAssets,
  Actions.getAssetAddresses,
  Actions.getPlatformAddresses
];
export default class APIHandler {
  private store;
  constructor(store: Store) {
    this.store = store;
  }

  public handle = async (request, sender, sendResponse) => {
    console.log(sender);
    // TODO: Check sender's permission

    if (_.includes(needAuthActions, request.type)) {
      const hasAuthentication = await this.hasAuthentication();
      if (!hasAuthentication) {
        sendResponse(this.createFailMessage("Not authorized"));
        return;
      }
      await this.loadWalletIfNeed();
    }

    switch (request.type) {
      case Actions.getNetworkId: {
        const state = this.store.getState() as ReducerConfigure;
        sendResponse(this.createMessage(state.globalReducer.networkId));
        return;
      }
      case Actions.isAuthenticated: {
        const state = this.store.getState() as ReducerConfigure;
        const passphrase = state.globalReducer.passphrase;
        const keyExisted = await isKeystoreExisted();
        sendResponse(this.createMessage(keyExisted && passphrase != null));
        return;
      }
      case Actions.getAvailableQuark: {
        const address = request.data.address;
        if (!address) {
          sendResponse(this.createFailMessage("invalid params"));
          return;
        }

        const availableQuark = await this.loadAvailableQuarkIfNeed(address);
        sendResponse(this.createMessage(availableQuark));
        return;
      }
      case Actions.getAvailableAssets: {
        const address = request.data.address;
        if (!address) {
          sendResponse(this.createFailMessage("invalid params"));
          return;
        }
        const availableAssets = await this.loadAvailableAssetsIfNeed(address);
        sendResponse(this.createMessage(availableAssets));
        return;
      }
      case Actions.getAssetAddresses: {
        const state = this.store.getState() as ReducerConfigure;
        const assetAddresses = state.walletReducer.assetAddresses;
        sendResponse(this.createMessage(assetAddresses));
        return;
      }
      case Actions.getPlatformAddresses: {
        const state = this.store.getState() as ReducerConfigure;
        const platformAddresses = state.walletReducer.platformAddresses;
        sendResponse(this.createMessage(platformAddresses));
        return;
      }
    }
  };

  private hasAuthentication = async () => {
    const state = this.store.getState() as ReducerConfigure;
    const passphrase = state.globalReducer.passphrase;
    const keyExisted = await isKeystoreExisted();

    if (!keyExisted || passphrase == null) {
      return false;
    }
    return true;
  };

  private loadWalletIfNeed = () => {
    return new Promise((resolve, reject) => {
      this.store.dispatch(walletActions.fetchWalletFromStorageIfNeed());
      let checker;
      let timeout;
      const checkerFunc = () => {
        const state = this.store.getState() as ReducerConfigure;
        const platformAddresses = state.walletReducer.platformAddresses;
        const assetAddresses = state.walletReducer.assetAddresses;
        if (platformAddresses && assetAddresses) {
          clearInterval(checker);
          clearTimeout(timeout);
          resolve();
        }
      };
      checker = setInterval(checkerFunc, 1000);
      checkerFunc();
      timeout = setTimeout(() => {
        clearInterval(checker);
        reject("loadWallet timeout");
      }, 15000);
    });
  };

  private loadAvailableQuarkIfNeed = (address: string) => {
    return new Promise((resolve, reject) => {
      this.store.dispatch(accountActions.fetchAvailableQuark(address));
      let checker;
      let timeout;
      const checkerFunc = () => {
        const state = this.store.getState() as ReducerConfigure;
        const availableQuark = state.accountReducer.availableQuark[address];
        if (availableQuark != null) {
          clearInterval(checker);
          clearTimeout(timeout);
          resolve(availableQuark);
        }
      };
      checker = setInterval(checkerFunc, 1000);
      checkerFunc();
      timeout = setTimeout(() => {
        clearInterval(checker);
        reject("loadQuark timeout");
      }, 15000);
    });
  };

  private loadAvailableAssetsIfNeed = (address: string) => {
    return new Promise((resolve, reject) => {
      this.store.dispatch(assetActions.fetchAvailableAssets(address));
      let checker;
      let timeout;
      const checkerFunc = () => {
        const state = this.store.getState() as ReducerConfigure;
        const availableAssets = state.assetReducer.availableAssets[address];
        if (availableAssets != null) {
          clearInterval(checker);
          clearTimeout(timeout);
          resolve(availableAssets);
        }
      };
      checker = setInterval(checkerFunc, 1000);
      checkerFunc();
      timeout = setTimeout(() => {
        clearInterval(checker);
        reject("loadAsset timeout");
      }, 15000);
    });
  };

  private createMessage = (data: any) => ({
    status: "success",
    data
  });

  private createFailMessage = (message: string) => ({
    status: message
  });
}
