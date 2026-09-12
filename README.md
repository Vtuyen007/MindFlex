# MindFlex

Rèn luyện trí não mỗi ngày với MindFlex - một ứng dụng rèn luyện não bộ toàn diện, được thiết kế tối ưu trên thiết bị di động.

## Giới thiệu dự án
MindFlex là ứng dụng rèn luyện não bộ sử dụng HTML5, CSS3, và JavaScript thuần. Ứng dụng cung cấp các trò chơi được thiết kế để rèn luyện nhiều kỹ năng như chú ý ngoại vi, linh hoạt nhận thức, và trí nhớ ngắn hạn.

## Danh sách tính năng
- **Bảng Schulte**: Luyện tốc độ đọc và chú ý ngoại vi.
- **Thử thách Stroop**: Kiểm soát ức chế và linh hoạt nhận thức.
- **Ghi nhớ chuỗi**: Cải thiện trí nhớ ngắn hạn.
- **Câu chuyện biểu tượng**: Trí nhớ liên kết và tưởng tượng.
- Hệ thống thống kê chi tiết cho từng trò chơi.
- Hoạt động offline hoàn toàn.
- Chế độ Sáng / Tối / Tự động (System).
- Hiệu ứng hình nền động RGB.

## Cấu trúc thư mục
```
MindFlexWeb/
|-- index.html
|-- README.md
|-- manifest.webmanifest
|-- css/
|   |-- variables.css
|   |-- reset.css
|   |-- base.css
|   |-- components.css
|   |-- games.css
|   |-- animations.css
|   `-- responsive.css
|-- js/
|   |-- app.js
|   |-- router.js
|   |-- storage.js
|   |-- theme.js
|   |-- audio.js
|   |-- statistics.js
|   |-- utils.js
|   `-- games/
|       |-- schulte.js
|       |-- stroop.js
|       |-- sequence-memory.js
|       `-- icon-story.js
`-- assets/
    `-- icons/
```

## Hướng dẫn mở ứng dụng
1. Mở trực tiếp: Bạn có thể click đúp vào tệp `index.html` để mở trong trình duyệt.
2. Dùng Live Server: Cài đặt tiện ích Live Server trong VS Code, chuột phải vào `index.html` và chọn "Open with Live Server".

## Cách chơi
- **Bảng Schulte**: Chạm vào các số hoặc chữ cái theo thứ tự từ nhỏ đến lớn (hoặc ngược lại).
- **Thử thách Stroop**: Lựa chọn màu sắc hoặc ý nghĩa của từ tùy theo yêu cầu của hệ thống (lưu ý: yêu cầu có thể thay đổi liên tục).
- **Ghi nhớ chuỗi**: Quan sát chuỗi số/chữ xuất hiện từng ký tự một và nhập lại đúng chuỗi đó.
- **Câu chuyện biểu tượng**: Nhớ dãy biểu tượng bằng cách tưởng tượng ra một câu chuyện liên kết chúng, sau đó chọn lại đúng biểu tượng trong số các biểu tượng bị nhiễu.

## Lưu trữ dữ liệu
Tất cả dữ liệu được lưu trữ trên trình duyệt của bạn (sử dụng `localStorage`). Ứng dụng không gửi dữ liệu của bạn đến bất kỳ máy chủ nào.

## Nhập / Xuất dữ liệu
Trong màn hình **Cài đặt**, bạn có thể:
- **Xuất dữ liệu**: Tải xuống tệp `JSON` chứa toàn bộ quá trình luyện tập của bạn.
- **Nhập dữ liệu**: Tải lên tệp `JSON` bạn đã xuất trước đó để khôi phục lại dữ liệu.
- **Xóa toàn bộ dữ liệu**: Xóa trắng dữ liệu luyện tập trên trình duyệt (có hộp thoại xác nhận trước khi xóa).

## Trình duyệt hỗ trợ
Ứng dụng hoạt động tốt trên các trình duyệt hiện đại (Chrome, Safari, Firefox, Edge) trên cả nền tảng máy tính và thiết bị di động.

## Web Audio API & localStorage
- Hệ thống âm thanh được tổng hợp trực tiếp bằng Web Audio API, do đó không cần tải xuống tệp âm thanh bên ngoài. Âm thanh sẽ được kích hoạt sau tương tác đầu tiên của người dùng theo quy định của trình duyệt.
- Dữ liệu hoàn toàn sử dụng `localStorage`. Đảm bảo trình duyệt không khóa chế độ lưu trữ cookie cục bộ để sử dụng được đầy đủ tính năng.

## Mở rộng thêm trò chơi
Để thêm một game mới:
1. Tạo module JS trong `js/games/`.
2. Tạo thẻ trong `index.html`.
3. Định nghĩa định tuyến (route) trong `router.js` và logic game tương ứng.

## Giới hạn
- Chỉ hỗ trợ các ngôn ngữ mà trình duyệt hỗ trợ.
- Chế độ rung (haptics) có thể không hoạt động trên iOS hoặc một số trình duyệt không hỗ trợ `navigator.vibrate`.
