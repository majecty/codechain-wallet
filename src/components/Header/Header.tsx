import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Dispatch } from "redux";
import { NetworkId } from "../../model/address";
import { ReducerConfigure } from "../../redux";
import actions from "../../redux/global/globalActions";
import { getNetworkNameById } from "../../utils/network";
import "./Header.css";

import * as Logo from "./img/logo.svg";
import * as MainNet from "./img/mainnet.svg";

interface StateProps {
    isAuthenticated: boolean;
    networkId: NetworkId;
}

interface DispatchProps {
    toggleMenu: () => void;
}

type Props = DispatchProps & StateProps;
class Header extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);
    }
    public render() {
        const { networkId } = this.props;
        return (
            <div className="Header">
                <div className="d-flex align-items-center h-100">
                    <div className="menu-btn" onClick={this.handleToggleMenu}>
                        <FontAwesomeIcon icon="bars" />
                    </div>
                    <Link to="/">
                        <img src={Logo} className="logo" />
                    </Link>
                    <div className="ml-auto">
                        {getNetworkNameById(networkId)}
                    </div>
                    <div>
                        <img src={MainNet} />
                    </div>
                </div>
            </div>
        );
    }

    private handleToggleMenu = async () => {
        this.props.toggleMenu();
    };
}
const mapStateToProps = (state: ReducerConfigure) => ({
    networkId: state.globalReducer.networkId,
    isAuthenticated: state.globalReducer.isAuthenticated
});
const mapDispatchToProps = (dispatch: Dispatch) => ({
    toggleMenu: () => {
        dispatch(actions.toggleMenu());
    }
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Header);
