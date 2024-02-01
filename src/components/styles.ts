import { StyleSheet } from "react-native";


interface styleInappProps {
  inAppData: any;
  SLIDER_WIDTH: number;
}
export const styleInapp = ({ inAppData, SLIDER_WIDTH }: styleInappProps) => StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    width: "100%",
    marginTop: 10,
  },
  styleContainer: {
    alignItems: 'center',
    backgroundColor: inAppData.background_color || 'white',
    elevation: 10,
    borderRadius: 10,
    width: SLIDER_WIDTH * 0.8,
  },
  // counter: {
  //   alignSelf: 'center',
  //   marginVertical: 10
  // },
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
  inAppData: any,
}
export const styleItem = ({ inAppData }: styleItemProps) => StyleSheet.create({
  btn_left: {
    width: inAppData.btn_right != '' ? '50%' : '100%',
    alignItems: 'center',
    backgroundColor: inAppData.btn_left_bg_color || '#DDDDDD',
    padding: 10,
    elevation: 10,
    borderRadius: 5,
  },
  btn_right: {
    width: inAppData.btn_left != '' ? '50%' : '100%',
    alignItems: 'center',
    backgroundColor: inAppData.btn_right_bg_color || '#DDDDDD',
    padding: 10,
    elevation: 10,
    borderRadius: 5,
  },
  btn_left_title: {
    color: inAppData.btn_left_txt_color || "#000000"
  },
  btn_right_title: {
    color: inAppData.btn_right_txt_color || "#000000"
  },
  body: {
    backgroundColor: inAppData.background_color,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: {
    color: inAppData.body_font_color || "#000000",
    textAlign: 'justify',
    marginBottom: 10,
    fontSize: 15,
    marginHorizontal: 10
  },
  title: {
    color: inAppData.title_font_color || "#000000",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 10
  },
  dot: {
    backgroundColor: inAppData.dot_color || "#FFFFFF",
    borderRadius: 100,
    width: 8,
    height: 8,
    marginLeft: 5,
    elevation: 5,
  },
  containerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 10
  },
  img: {
    width: '100%',
    height: 150
  }
});
