import React, { useState, useEffect, useContext, useRef } from "react";
import { Drawer, Layout, Menu } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  FileTextOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
// import { AuthContext } from "../Auth/AuthContext";
import "../MasterLayout/Master.css";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onCollapse: (collapsed: boolean) => void;
  isSmallScreen: boolean;
  disableHover: boolean;
  onItemClick: () => void;
  hoverEffectActive: boolean;
  setHoverEffectActive: (val: boolean) => void;
  forceCollapse: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  onCollapse,
  isSmallScreen,
  disableHover,
  onItemClick,
}) => {
  const Logo_Main = require("../Assets/VEERRAJLOGOR.jpg");
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovering, setIsHovering] = useState(false);
  const [activeMenuItemKey, setActiveMenuItemKey] = useState<string | null>(
    null
  );
  const [hoverEffectActive, setHoverEffectActive] = useState(true);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const siderRef = useRef<HTMLDivElement>(null);
  //   const { authData } = useContext(AuthContext);

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined style={{ color: "inherit" }} />,
      text: "Dashboard",
      link: "/dashboard",
    },
    {
      key: "online-order",
      icon: <ShoppingCartOutlined style={{ color: "inherit" }} />,
      text: "Online Order",
      link: "/online-order",
    },
    {
      key: "dealers",
      icon: <ShopOutlined style={{ color: "inherit" }} />,
      text: "Dealers",
      link: "/dealer",
    },
    {
      key: "sales",
      icon: <FileTextOutlined style={{ color: "inherit" }} />,
      text: "Sales",
      link: "/sales",
    },
  ];

  useEffect(() => {
    const currentItem = menuItems.find(
      (item) =>
        location.pathname === item.link ||
        (item.link && location.pathname.startsWith(item.link + "/"))
    );
    if (currentItem) {
      setActiveMenuItemKey(currentItem.key);
    } else {
      setActiveMenuItemKey(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/dealer": "Dealers",
      "/sales": "Sales",
    };

    let title = "Veerraj Food";
    if (routeTitles[location.pathname]) {
      title = `${routeTitles[location.pathname]} | Veerraj Food`;
    }

    document.title = title;
  }, [location.pathname]);

  const handleMouseEnter = () => {
    if (disableHover) return;
    setIsHovering(true);
    if (collapsed && hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoverEffectActive(false);
  };

  const handleMouseLeave = () => {
    if (disableHover) return;
    setIsHovering(false);
    if (collapsed) {
      const timeout = setTimeout(() => {
        setHoverEffectActive(true);
        setOpenKeys([]);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  const handleMenuItemClick = (key: string) => {
    const item = menuItems.find((item) => item.key === key);
    if (item) {
      setActiveMenuItemKey(item.key);
      navigate(item.link);
      onItemClick?.();
      if (isSmallScreen) setCollapsed(true);
    }
  };

  const toggleCollapse = () => {
    onCollapse(!collapsed);
  };

  return (
    <>
      {isSmallScreen ? (
        <Drawer
          placement="left"
          closable={true}
          onClose={toggleCollapse}
          width="200px"
          open={!collapsed}
          maskClosable
          bodyStyle={{
            backgroundColor: "#001529",
            padding: 0,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              backgroundColor: "#001529",
              padding: "1rem 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img src={Logo_Main} alt="logo" style={{ maxHeight: "8vw" }} />
          </div>
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[activeMenuItemKey || ""]}
            style={{ color: "white", width: "100%" }}
          >
            {menuItems.map((item) => (
              <Menu.Item
                key={item.key}
                icon={<span style={{ fontSize: "24px" }}>{item.icon}</span>}
                onClick={() => handleMenuItemClick(item.key)}
              >
                <Link
                  to={item.link}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {item.text}
                </Link>
              </Menu.Item>
            ))}
          </Menu>
        </Drawer>
      ) : (
        <Sider
          ref={siderRef}
          trigger={null}
          collapsible
          collapsed={collapsed && !(!disableHover && isHovering)}
          collapsedWidth={80}
          width={200}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "fixed",
            height: "100vh",
            zIndex: 1000,
            overflow: "hidden",
            background: "linear-gradient(180deg, #E0F7F6 0%, #B2DFDB 100%)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              backgroundColor: "#E0F7F6",
              marginBottom: "10px",
              padding: "10px 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={Logo_Main}
              alt="logo"
              style={{
                maxHeight: "70px",
                transition: "all 0.2s",
                width: collapsed ? "60px" : "auto",
              }}
            />
          </div>

          <Menu
            mode="inline"
            selectedKeys={[activeMenuItemKey || ""]}
            style={{
              backgroundColor: "transparent", // let gradient show
              borderRight: "none",
            }}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: (
                <span style={{ fontSize: "20px", color: "#00695C" }}>
                  {item.icon}
                </span>
              ),
              label: (
                <Link
                  to={item.link}
                  style={{
                    textDecoration: "none",
                    color: "#004D40", // default font
                    fontWeight: 500,
                  }}
                >
                  {item.text}
                </Link>
              ),
            }))}
          />
        </Sider>
      )}
    </>
  );
};

export default Sidebar;
