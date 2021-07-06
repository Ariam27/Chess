import wx

class Frame(wx.Frame):
    def __init__(self):
        super().__init__(parent=None, title="Chess")

        self.SetIcon(wx.Icon("logo.png"))

        self.panel = wx.Panel(self)

        self.sizer = wx.BoxSizer(wx.VERTICAL)

        self.text_ctrl = wx.TextCtrl(self.panel)
        self.btn = wx.Button(self.panel, label="Hello")

        self.sizer.Add(self.text_ctrl, 0, wx.ALL|wx.EXPAND, 5)
        self.sizer.Add(self.btn, 0, wx.ALL|wx.CENTER|wx.EXPAND, 5)
        self.panel.SetSizer(self.sizer)

        self.Show()

app = wx.App()
app.locale = wx.Locale(wx.LANGUAGE_ENGLISH)
frame = Frame()
app.MainLoop()