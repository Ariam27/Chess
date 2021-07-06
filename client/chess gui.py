import tkinter as tk
from tkinter import ttk
from tkinter.font import Font
from PIL import ImageTk, Image

class RoundedButton(tk.Canvas):
    def __init__(self, parent, width, height, cornerradius, padding, text, fg, font, color, bg, command=None):
        tk.Canvas.__init__(self, parent, borderwidth=0, 
            relief="raised", highlightthickness=0, bg=bg)
        self.command = command
        self.bg = bg
        self.shapes = []
        self.color = color
        self.fg = fg

        if cornerradius > 0.5*width:
            print("Error: cornerradius is greater than width.")
            return None

        if cornerradius > 0.5*height:
            print("Error: cornerradius is greater than height.")
            return None

        rad = 2*cornerradius
        def shape():
            self.shapes.append(self.create_polygon((padding,height-cornerradius-padding,padding,cornerradius+padding,padding+cornerradius,padding,width-padding-cornerradius,padding,width-padding,cornerradius+padding,width-padding,height-cornerradius-padding,width-padding-cornerradius,height-padding,padding+cornerradius,height-padding), fill=color, outline=color))
            self.shapes.append(self.create_arc((padding,padding+rad,padding+rad,padding), start=90, extent=90, fill=color, outline=color))
            self.shapes.append(self.create_arc((width-padding-rad,padding,width-padding,padding+rad), start=0, extent=90, fill=color, outline=color))
            self.shapes.append(self.create_arc((width-padding,height-rad-padding,width-padding-rad,height-padding), start=270, extent=90, fill=color, outline=color))
            self.shapes.append(self.create_arc((padding,height-padding-rad,padding+rad,height-padding), start=180, extent=90, fill=color, outline=color))

        id = shape()
        (x0,y0,x1,y1) = self.bbox("all")
        width = (x1-x0)
        height = (y1-y0)
        self.configure(width=width, height=height)
        self.bind("<ButtonPress-1>", self._on_press)
        self.bind("<ButtonRelease-1>", self._on_release)

        self.text = self.create_text(width/2, height/2-3, fill=fg, font=font, text=text)

    def _on_press(self, event):
        self.configure(relief="sunken")
        for i in self.shapes: self.itemconfig(i, fill="#f0f0f0", outline="#f0f0f0")
        self.itemconfig(self.text, fill="black")

    def _on_release(self, event):
        self.configure(relief="raised")
        for i in self.shapes: self.itemconfig(i, fill=self.color, outline=self.color)
        self.itemconfig(self.text, fill=self.fg)
        if self.command is not None:
            self.command()
            
class App(tk.Tk):
    def __init__(self, width, height, resizable):
        super().__init__()
        self.geometry(f"{width}x{height}")
        self.resizable(*resizable)

        self.update()

    def load_scene(self, scene):
        scene(self).grid(row=0, column=0)

    @property
    def width(self):
        return int((app.geometry().split("+")[0]).split("x")[0])

    @property
    def height(self):
        return int((app.geometry().split("+")[0]).split("x")[1])

class Scene(tk.Frame):
    def __init__(self, root, *args, **kwargs):
        super().__init__(root, *args, **kwargs)

class Login(Scene):
    def __init__(self, root):
        super().__init__(root, bg="#333333", width=root.width, height=root.height)
        self.grid_propagate(False)
        self.rowconfigure(0, weight=1)
        self.columnconfigure([0,1], weight=1, minsize=200)

        self.levels = ["Beginner", "Intermediate", "Expert"]

        self.heading_font = "{beton-sans} 20"
        self.normal_font = "{Helvetica Neue} 12"
        
        self.frm_controls = tk.Frame(self, bg=self["bg"])
        self.frm_controls.rowconfigure(0, weight=1, minsize=50)
        self.frm_controls.rowconfigure([1,2], weight=1)
        self.frm_controls.columnconfigure([0,1], weight=1)
        
        self.frm_image = tk.Frame(self, bg=self["bg"])

        img = ImageTk.PhotoImage(Image.open("logo.png"))
        self.lbl_image = tk.Label(self.frm_image, image=img, bg=self["bg"])
        self.lbl_image.photo = img

        self.frm_login = tk.Frame(self.frm_controls, bg="white")
        self.frm_login.rowconfigure([0,1,2], weight=1)
        self.frm_login.columnconfigure([0,1], weight=1)

        self.frm_signup = tk.Frame(self.frm_controls, bg="white")
        self.frm_signup.rowconfigure([0,1,2,3,4], weight=1)
        self.frm_signup.columnconfigure([0,1], weight=1)
        self.level_variable = tk.StringVar(self.frm_signup)
        self.level_variable.set(self.levels[0])

        self.lbl_title = tk.Label(self.frm_controls, text="Chess", bg=self["bg"], fg="white", font="{beton-sans} 30")

        self.lbl_login = tk.Label(self.frm_controls, text="Login", bg="white", fg="black", font=self.heading_font)
        self.lbl_signup = tk.Label(self.frm_controls, text="Sign Up", bg=self["bg"], fg="white", font=self.heading_font)
        self.lbl_login.bind("<Button-1>", self.switch)
        self.lbl_signup.bind("<Button-1>", self.switch)

        self.lbl_login_username = tk.Label(self.frm_login, text="Username: ", bg="white", fg="black", font=self.normal_font)
        self.lbl_login_password = tk.Label(self.frm_login, text="Password: ", bg="white", fg="black", font=self.normal_font)
        self.ent_login_username = tk.Entry(self.frm_login, bg="white", fg="black", font=self.normal_font)
        self.ent_login_password = tk.Entry(self.frm_login, bg="white", fg="black", font=self.normal_font)        
        #self.btn_login_submit = tk.Button(self.frm_login, text="Login", bg="#00b300", fg="white", font=self.normal_font)
        self.btn_login_submit = RoundedButton(self.frm_login, 305, 30, 10, 0, "Login", "white", self.normal_font, "#00b300", "white")

        self.lbl_signup_username = tk.Label(self.frm_signup, text="Username: ", bg="white", fg="black", font=self.normal_font)
        self.lbl_signup_email = tk.Label(self.frm_signup, text="Email: ", bg="white", fg="black", font=self.normal_font)
        self.lbl_signup_password = tk.Label(self.frm_signup, text="Password: ", bg="white", fg="black", font=self.normal_font)
        self.lbl_signup_level = tk.Label(self.frm_signup, text="Level: ", bg="white", fg="black", font=self.normal_font)
        
        self.ent_signup_username = tk.Entry(self.frm_signup, bg="white", fg="black", font=self.normal_font)
        self.ent_signup_email = tk.Entry(self.frm_signup, bg="white", fg="black", font=self.normal_font)
        self.ent_signup_password = tk.Entry(self.frm_signup, bg="white", fg="black", font=self.normal_font)

        self.opm_signup_level = tk.OptionMenu(self.frm_signup, self.level_variable, *self.levels)        
        #self.btn_signup_submit = tk.Button(self.frm_signup, text="Sign Up", bg="#00b300", fg="white", font=self.normal_font)
        self.btn_signup_submit = RoundedButton(self.frm_signup, 305, 30, 10, 0, "Sign Up", "white", self.normal_font, "#00b300", "white")
        
        self.lbl_title.grid(row=0, column=0, columnspan=2, sticky="NSEW", pady=(50,25))

        self.lbl_image.grid(row=0, column=0, padx=(15, 0), pady=(100, 50))
        
        self.lbl_login.grid(row=1, column=0, sticky="NSEW")
        self.lbl_signup.grid(row=1, column=1, sticky="NSEW")

        self.lbl_signup_username.grid(row=0, column=0, sticky="NSEW", pady=5, padx=5)
        self.lbl_signup_email.grid(row=1, column=0, sticky="NSEW", pady=5, padx=5)
        self.lbl_signup_password.grid(row=2, column=0, sticky="NSEW", pady=5, padx=5)
        self.lbl_signup_level.grid(row=3, column=0, sticky="NSEW", pady=5, padx=5)
        self.ent_signup_username.grid(row=0, column=1, sticky="NSEW", pady=5, padx=5)
        self.ent_signup_email.grid(row=1, column=1, sticky="NSEW", pady=5, padx=5)
        self.ent_signup_password.grid(row=2, column=1, sticky="NSEW", pady=5, padx=5)
        self.opm_signup_level.grid(row=3, column=1, sticky="NSEW", pady=5, padx=5)
        self.btn_signup_submit.grid(row=4, column=0, columnspan=2, sticky="NSEW", pady=5, padx=5)
        
        self.lbl_login_username.grid(row=0, column=0, sticky="NSEW", pady=5, padx=5)
        self.lbl_login_password.grid(row=1, column=0, sticky="NSEW", pady=5, padx=5)
        self.ent_login_username.grid(row=0, column=1, sticky="NSEW", pady=5, padx=5)
        self.ent_login_password.grid(row=1, column=1, sticky="NSEW", pady=5, padx=5)
        self.btn_login_submit.grid(row=2, column=0, columnspan=2, sticky="NSEW", pady=5, padx=5)
        
        self.frm_login.grid(row=2, column=0, columnspan=2, sticky="NSEW")

        self.frm_image.grid(row=0, column=0, sticky="NSEW")
        self.frm_controls.grid(row=0, column=1, sticky="NW")

    def switch(self, event):
        if event.widget == self.lbl_login:
            if not bool(self.frm_login.winfo_ismapped()):
                self.frm_signup.grid_forget()
                self.frm_login.grid(row=2, column=0, columnspan=2, sticky="NSEW")
                
                self.lbl_signup["bg"] = self["bg"]
                self.lbl_signup["fg"] = "white"

                self.lbl_login["bg"] = "white"
                self.lbl_login["fg"] = "black"
        elif event.widget == self.lbl_signup:
            if not bool(self.frm_signup.winfo_ismapped()):
                self.frm_login.grid_forget()
                self.frm_signup.grid(row=2, column=0, columnspan=2, sticky="NSEW")
                
                self.lbl_login["bg"] = self["bg"]
                self.lbl_login["fg"] = "white"

                self.lbl_signup["bg"] = "white"
                self.lbl_signup["fg"] = "black"

if __name__ == "__main__":
    app = App(600, 400, (0,0))
    app.load_scene(Login)
    app.mainloop()
