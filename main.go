package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// 提供静态文件服务
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	port := "9090"
	fmt.Printf("图片处理工具服务器启动在: http://localhost:%s\n", port)
	fmt.Println("在浏览器中打开上述地址即可使用")

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
