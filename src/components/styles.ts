import { PlatformColor, StyleSheet } from "react-native";


export const buildStyles = (data: any, screen: any) => StyleSheet.create({
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Cor do botão
    borderRadius: 25, // Torna o botão circular
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  textButton: {
    color: '#000', // Cor do texto "X"
    fontSize: 16, // Tamanho do "X"
    fontWeight: 'bold', // Deixa o "X" em negrito
  },
  content: {
    backgroundColor: data?.background_color,
    flexDirection: "column",
    borderRadius: 20,
    paddingBottom: 16,
    paddingRight: 16,
    paddingLeft: 16,
    margin: 16,
    overflow: "hidden",
    elevation: 10,
    width: screen,
    alignItems: "center"
  },
  messageData: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  title: {
    color: data?.title_font_color,
    fontWeight: "500",
    fontSize: 18,
  },
  body: {
    color: data?.body_font_color,
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  buttonLeft: {
    margin: 2,
    flex: 1,
    backgroundColor: data?.btn_left_bg_color,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRight: {
    margin: 2,
    flex: 1,
    backgroundColor: data?.btn_right_bg_color,
    justifyContent: "center",
    alignItems: "center",
  },
  textButtonLeft: {
    color: data?.btn_left_txt_color,
    textAlign: "center",
    backgroundColor: "transparent",
    padding: 8,
    fontSize: 14,
  },
  textButtonRight: {
    color: data?.btn_right_txt_color,
    textAlign: "center",
    backgroundColor: "transparent",
    padding: 8,
    fontSize: 14,
  },
})