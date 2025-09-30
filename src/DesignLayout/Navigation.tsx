import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import '../MasterLayout/Master.css';

interface NavigationProps {
    activeMenu: boolean;
    handleClick: () => void;
}

const { Sider } = Layout;

const Navigation: React.FC<NavigationProps> = ({ activeMenu, handleClick }) => {

    return (
        <>
            <Sider
                collapsible
                collapsedWidth={80}
                className='bg-dark'
            >
                <div style={{
                    top: 0,
                    position: 'sticky',
                    display: 'block',
                    backgroundColor: '#000000',
                    textAlign: 'center',
                    zIndex: 999,
                }}>
                    <img alt="ImageLogo"
                        style={{
                            maxHeight: '70px',
                            margin: 'auto',
                        }}
                    />
                </div>

            </Sider>
        </>
    );
};


export default Navigation;
