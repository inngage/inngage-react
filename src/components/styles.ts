import { StyleSheet } from "react-native";


interface styleInappProps {
  SLIDER_WIDTH: number;
}
export const styleInapp = ({ SLIDER_WIDTH }: styleInappProps) => StyleSheet.create({
  carouselContainer: {
    width: "100%",
    marginTop: 10,
  },
  styleContainer: {
    backgroundColor: 'white',
    elevation: 10,
    borderRadius: 10,
    width: SLIDER_WIDTH * 0.8,
    height: 480,
  },
  counter: {
    alignSelf: 'center',
    marginVertical: 10
  },
  closeButton: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: 20,
    top: 20,
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#00000020',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
});

interface styleItemProps {
  msg: any,
  checkBG: Function,
}
export const styleItem = ({ msg, checkBG }: styleItemProps) => StyleSheet.create({
  btn_left: {
    backgroundColor: msg.btn_left_bg_color || "#FFFFFF",
    height: 40,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    marginLeft: 10,
    flex: 1
  },
  btn_right: {
    backgroundColor: msg.btn_right_bg_color || "#FFFFFF",
    height: 40,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flex: 1
  },
  btn_left_title: {
    color: msg.btn_left_txt_color || "#000000"
  },
  btn_right_title: {
    color: msg.btn_right_txt_color || "#000000"
  },
  body: {
    backgroundColor: checkBG(),
    width: '100%',
    height: 450,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: {
    color: msg.body_font_color || "#000000",
    textAlign: 'justify',
    marginBottom: 10,
    fontSize: 15,
    marginHorizontal: 10
  },
  title: {
    color: msg.title_font_color || "#000000",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 40
  },
  dot: {
    backgroundColor: msg.dot_color || "#FFFFFF",
    borderRadius: 100,
    width: 8,
    height: 8,
    marginLeft: 5,
    elevation: 5,
  }
});